using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class BossApparition : MonoBehaviour
{

	public GameObject boss;
	private bool once = false;
	// Use this for initialization
	void Start () {

	}

	// Update is called once per frame
	void Update ()
	{
//		Debug.Log("ww" + GameObject.FindWithTag("enemy"));
		if (GameObject.FindWithTag("enemy") == null && !once)
		{
			once = true;
			boss.SetActive(true);
		}
	}
}
