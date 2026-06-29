using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class RestartGame : MonoBehaviour
{

	private GameObject _player;

	private void Start()
	{
		_player = GameObject.FindWithTag("Player");
	}


	public void Restart()
	{
		_player.GetComponent<PlayerHealth>().LifePoints = 20;
		_player.transform.position = new Vector3(1f, -5, 0);
		SceneManager.LoadScene("VillagerHouse");
		GameObject.FindWithTag("GameOver").SetActive(false);
	}
}
